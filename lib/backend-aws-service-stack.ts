import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'; 
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BackendAwsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //create DynamoDB table for student
    const studentTable = new dynamodb.Table(this, 'StudentTable', {
      partitionKey: { name: 'studentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })

    // create the audit event sqs queue
  const auditQueue=new sqs.Queue(this,'Auditqueue',{
    visibilityTimeout:cdk.Duration.seconds(300),
  })

  //create the lambda function  
  const studentLambda = new lambda.Function(this, 'StudentLambda', {
   runtime:lambda.Runtime.NODEJS_20_X,
   handler:'student.handler',
   code:lambda.Code.fromAsset('lambda'),
   environment:{
    STUDENT_TABLE: studentTable.tableName,
    AUDIT_QUEUE_URL:auditQueue.queueUrl
   },
  });

  // Grant the Lambda function permission to interact with the DynamoDB table and SQS
  studentTable.grantReadWriteData(studentLambda);
  auditQueue.grantSendMessages(studentLambda);
 
      // Create API Gateway to trigger Lambda
      const api = new apigateway.RestApi(this, 'StudentApi', {
        restApiName: 'Student Service',
        description: 'This service handles student management.',
      });
  
      const student = api.root.addResource('student');
      student.addMethod('POST', new apigateway.LambdaIntegration(studentLambda)); // Create student
      student.addMethod('GET', new apigateway.LambdaIntegration(studentLambda)); // Get student by ID
      student.addMethod('PUT', new apigateway.LambdaIntegration(studentLambda)); // Update student
      student.addMethod('DELETE', new apigateway.LambdaIntegration(studentLambda)); // Delete student
  }
}
