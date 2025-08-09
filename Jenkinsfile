pipeline {
    agent {
        label 'kaniko'
    }

    environment {
        HARBOR_REGISTRY = 'harbor.anatoly.dev'
        HARBOR_PROJECT = 'mcp'
        IMAGE_NAME = 'mcp-server-starter'
        GIT_COMMIT_SHORT = "${env.GIT_COMMIT.take(7)}"
        BRANCH_NAME_CLEAN = "${params.BRANCH_NAME.replaceAll('origin/', '').replaceAll('/', '-')}"
    }

    stages {
        stage('Build and Push') {
            steps {
                container('kaniko') {
                    script {
                        withCredentials([usernamePassword(
                            credentialsId: 'harbor-credentials',
                            usernameVariable: 'HARBOR_USER',
                            passwordVariable: 'HARBOR_PASS'
                        )]) {
                            sh '''
                                echo '{"auths":{"'${HARBOR_REGISTRY}'":{"username":"'${HARBOR_USER}'","password":"'${HARBOR_PASS}'"}}}' > /kaniko/.docker/config.json
                                /kaniko/executor \
                                    --context . \
                                    --dockerfile ./Dockerfile \
                                    --destination ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${IMAGE_NAME}:latest \
                                    --destination ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${IMAGE_NAME}:${BRANCH_NAME_CLEAN} \
                                    --destination ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${IMAGE_NAME}:${GIT_COMMIT_SHORT}
                            '''
                        }
                    }
                }
            }
        }
    }
}