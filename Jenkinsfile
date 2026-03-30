pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS'
    }
    
    environment {
        SONARQUBE = 'SonarQube'
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'dev',
                    url: 'https://github.com/valium69mg/single-vendor-ecommerce-frontend'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'
            }
        }

        stage('Lint') {
            steps {
                echo 'Running lint...'
                sh 'npm run lint'
            }
        }

        stage('Unit Tests') {
            steps {
                echo 'Running unit tests...'
                sh 'npm run test -- --watchAll=false'
            }
        }

        stage('Build') {
            steps {
                echo 'Building the project...'
                sh 'npm run build'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube analysis...'
                withSonarQubeEnv("${SONARQUBE}") {
                    sh '''
                        npx sonar-scanner \
                        -Dsonar.projectKey=single-vendor-ecommerce-frontend \
                        -Dsonar.sources=src
                    '''
                }
            }
        }

        stage('Wait for SonarQube Quality Gate') {
            steps {
                echo 'Waiting for SonarQube Quality Gate...'
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }

    post {
        success {
            echo '✅ Build, tests and SonarQube Quality Gate passed!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
