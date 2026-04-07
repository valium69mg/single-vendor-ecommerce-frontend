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

        stage('Install') {
            agent any
            steps {
                script {
                    docker.image('node:20-bullseye-slim').inside('--memory=512m --cpus=0.5 --user=root') {
                        sh 'npm ci'
                    }
                }
            }
        }

        stage('Build') {
            agent any
            steps {
                script {
                    docker.image('node:20-bullseye-slim').inside('--memory=1536m --cpus=1 --user=root') {
                        sh '''
                            export NODE_OPTIONS="--max-old-space-size=1024"
                            npm run build
                        '''
                    }
                }
            }
        }

        /*
        stage('SonarQube Analysis') {
            agent any
            steps {
                script {
                    docker.image('sonarsource/sonar-scanner-cli:latest').inside('--memory=1024m --cpus=0.5 --network=jenkins_default -u 0:0') {
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
        */

        stage('Build & Push Docker Image') {
            agent any
            steps {
                echo 'Building Docker image...'
                sh "docker build -t carlostranquilinocr98/single-vendor-ecommerce-frontend:latest ."

                echo 'Pushing Docker image to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', 
                                                usernameVariable: 'DOCKER_USER', 
                                                passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    sh "docker push carlostranquilinocr98/single-vendor-ecommerce-frontend:latest"
                }
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['ubuntu-server-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@3.80.104.36 << 'EOF'
                        cd /home/ubuntu/single-vendor-ecommerce
                        docker compose pull
                        docker compose up -d postgres redis backend frontend thumbnail-worker --remove-orphans
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Deploy completed'
        }
        failure {
            echo '❌ Deploy failed failed!'
        }
    }
}