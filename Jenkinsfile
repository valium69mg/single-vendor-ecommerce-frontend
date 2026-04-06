pipeline {
    agent any

    environment {
        SONARQUBE = 'SonarQube'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'dev',
                    url: 'https://github.com/valium69mg/single-vendor-ecommerce-frontend'
            }
        }

        stage('Install & Build') {
            steps {
                script {
                    // Use slim Node image and limit memory to 1GB
                    docker.image('node:20-bullseye-slim').inside('--memory=1g --cpus=1 --user=root') {
                        echo 'Installing dependencies and building frontend...'
                        sh '''
                            npm ci
                            npm run build
                        '''
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    // Use SonarQube scanner in a lightweight container with memory limit
                    docker.image('sonarsource/sonar-scanner-cli:latest').inside('--memory=512m --cpus=1') {
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