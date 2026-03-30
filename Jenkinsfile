pipeline {
    agent none

    environment {
        SONARQUBE = 'SonarQube'
    }

    stages {

        stage('Checkout') {
            agent any
            steps {
                git branch: 'dev',
                    url: 'https://github.com/valium69mg/single-vendor-ecommerce-frontend'
            }
        }

        stage('Install') {
            agent {
                docker {
                    image 'node:20-bullseye'
                }
            }
            steps {
                sh 'npm ci'
            }
        }

        stage('SonarQube Analysis') {
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli:latest'
                    args '--network=jenkins_default -u 0:0'
                }
            }
            environment {
                SONAR_HOST_URL = 'http://sonarqube:9000'
                SONAR_LOGIN = credentials('sonar-token')
            }
            steps {
                sh '''
                    sonar-scanner \
                    -Dsonar.projectKey=single-vendor-ecommerce-frontend \
                    -Dsonar.sources=src \
                    -Dsonar.host.url=$SONAR_HOST_URL \
                    -Dsonar.login=$SONAR_LOGIN
                '''
            }
        }

        stage('Quality Gate') {
            agent any
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }

    post {
        success {
            echo '✅ SonarQube Quality Gate passed!'
        }
        failure {
            echo '❌ SonarQube failed!'
        }
    }
}
