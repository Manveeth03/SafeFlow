pipeline {
  agent any

  options { timestamps(); disableConcurrentBuilds() }

  parameters {
    booleanParam(name: 'RUN_SONAR', defaultValue: false, description: 'Run SonarQube analysis (needs the SonarQube server and scanner configured in Jenkins)')
  }

  tools { nodejs 'node22' }   // NodeJS plugin tool, version 22

  environment {
    IMAGE_BACKEND  = "safeflow-backend:${env.BUILD_NUMBER}"
    IMAGE_FRONTEND = "safeflow-frontend:${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install dependencies') {
      steps {
        sh '''
          for d in backend frontend; do
            (cd $d && if [ -f package-lock.json ]; then npm ci; else npm install; fi)
          done
        '''
      }
    }

    stage('Lint') {
      steps {
        sh 'cd backend && npm run lint'
        sh 'cd frontend && npm run lint'
      }
    }

    stage('Test') {
      steps {
        sh 'cd backend && npm test'
        sh 'cd frontend && npm test'
      }
    }

    stage('Build') {
      steps {
        sh 'cd backend && npm run build'
        sh 'cd frontend && npm run build'
      }
    }

    stage('SonarQube analysis') {
      when { expression { params.RUN_SONAR } }
      steps {
        script { scannerHome = tool 'sonar-scanner' }   // SonarQube Scanner tool
        withSonarQubeEnv('sonarqube') {                  // Server name from Manage Jenkins > System
          sh "${scannerHome}/bin/sonar-scanner"
        }
        timeout(time: 10, unit: 'MINUTES') { waitForQualityGate abortPipeline: true }
      }
    }

    stage('Trivy filesystem + dependency scan') {
      steps {
        sh 'mkdir -p reports'
        // Fails the build on HIGH/CRITICAL findings. Scans dependencies, secrets and IaC misconfiguration.
        sh 'trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --exit-code 1 --ignorefile .trivyignore --format table --output reports/trivy-fs.txt .'
      }
    }

    stage('Build Docker images') {
      steps {
        sh 'docker build -t $IMAGE_BACKEND ./backend'
        sh 'docker build -t $IMAGE_FRONTEND ./frontend'
      }
    }

    stage('Trivy image scan') {
      steps {
        sh 'trivy image --severity HIGH,CRITICAL --exit-code 1 --format table --output reports/trivy-backend-image.txt $IMAGE_BACKEND'
        sh 'trivy image --severity HIGH,CRITICAL --exit-code 1 --format table --output reports/trivy-frontend-image.txt $IMAGE_FRONTEND'
      }
    }
  }

  post {
    always { archiveArtifacts artifacts: 'reports/*', allowEmptyArchive: true }
  }
}
