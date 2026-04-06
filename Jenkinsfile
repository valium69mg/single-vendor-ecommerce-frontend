pipeline {
    agent none

    environment {
        SONARQUBE = 'SonarQube'
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {

        stage('Checkout') {
            agent any
            steps {
                git branch: 'dev',
                    url: 'https://github.com/valium69mg/single-vendor-ecommerce-frontend'
            }
        }

        stage('Install & Build') {
            agent any
            steps {
                script {
                    docker.image('node:20-bullseye-slim').inside('--memory=768m --cpus=0.8 --user=root') {
                        sh '''
                            npm ci --prefer-offline
                            npm run build
                        '''
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            agent any
            steps {
                script {
                    docker.image('sonarsource/sonar-scanner-cli:latest').inside('--memory=512m --cpus=0.5 --network=jenkins_default -u 0:0') {
                        withSonarQubeEnv('SonarQube') {
                            withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                                sh '''
                                    sonar-scanner \
                                    -Dsonar.projectKey=single-vendor-ecommerce-frontend \
                                    -Dsonar.sources=src \
                                    -Dsonar.host.url=$SONAR_HOST_URL \
                                    -Dsonar.login=$SONAR_TOKEN
                                '''
                            }
                        }
                    }
                }
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