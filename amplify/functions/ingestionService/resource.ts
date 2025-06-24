import { Backend, defineFunction } from '@aws-amplify/backend';
import { 
  Duration,
  RemovalPolicy,
  Size,
  Stack,
  StackProps,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_kinesis as kinesis,
  aws_lambda as lambda,
  aws_lambda_event_sources as lambda_event_sources,
  aws_s3 as s3,
  aws_s3_notifications as s3_notifications,
  aws_sqs as sqs,
} from 'aws-cdk-lib';
import { CfnIdentityPool, CfnUserPool, CfnUserPoolDomain } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import vpc from '../../vpc';


export interface IngestionServiceStackProps extends StackProps {
  appSecurityGroup: ec2.ISecurityGroup;
  ingestionBucketName: string;
  parentStack: Stack;
  vectorStoreEndpoint: string;
  vpc: ec2.IVpc;
}


export default class IngestionServiceStack extends Stack {
  
  constructor(
    scope: Construct,
    id: string, props: IngestionServiceStackProps
  ) {
    super(scope, id, props)
    const ingestionQueueDLQ = new sqs.Queue(this, 'IngestionQueueDLQ', {
      visibilityTimeout: Duration.seconds(300),
    });

    const ingestionQueue = new sqs.Queue(this, 'IngestionQueue', {
      visibilityTimeout: Duration.minutes(15),
      deadLetterQueue: {
        queue: ingestionQueueDLQ,
        maxReceiveCount: 3
      }
    });

    ingestionQueue.grantSendMessages(new iam.ServicePrincipal('s3.amazonaws.com'))
    const bucketNotification = new s3_notifications.SqsDestination(ingestionQueue);
    const ingestionBucket = s3.Bucket.fromBucketName(
      this,
      'IngestionBucket',
      props.ingestionBucketName
    )
    
    ingestionBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      bucketNotification,
      { prefix: 'private/' }
    )

    const kinesisStream = new kinesis.Stream(this, 'IngestionKinesisStream', {
      removalPolicy: RemovalPolicy.DESTROY,
      retentionPeriod:  Duration.hours(24),
      streamMode: kinesis.StreamMode.ON_DEMAND,
      streamName: `${this.stackName}-ingestion`
    });
    
    const ingestionFunction = new lambda.Function(this, 'IngestionFunction', {
      code: lambda.Code.fromAssetImage(
        'amplify/functions/',{
          file: "Dockerfile.ingestionService"
        }
      ),
      memorySize:4096,
      ephemeralStorageSize: Size.gibibytes(10),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      runtime: lambda.Runtime.FROM_IMAGE,
      handler: lambda.Handler.FROM_IMAGE,
      architecture: lambda.Architecture.X86_64,
      timeout: Duration.minutes(15),
      securityGroups: [props.appSecurityGroup],
      environment: { 
        VECTOR_STORE_ENDPOINT: props.vectorStoreEndpoint,
        KINESIS_STREAM_NAME: kinesisStream.streamName,
      }
    })
    kinesisStream.grantWrite(ingestionFunction.grantPrincipal)
    ingestionQueue.grantConsumeMessages(ingestionFunction.grantPrincipal)
    ingestionBucket.grantRead(ingestionFunction.grantPrincipal)

    const queueNotification = new lambda_event_sources.SqsEventSource(ingestionQueue);
    const evtSourceMapping = new lambda.EventSourceMapping(this, 'IngestionQueueEvtSourceMapping', {
      target: ingestionFunction,
      enabled: true,
      batchSize: 1,
      eventSourceArn: ingestionQueue.queueArn
    });
  }

}