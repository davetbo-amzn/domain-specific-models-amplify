//  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0
import {
    StackProps,
    RemovalPolicy,
    Stack,
 } from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as aos from 'aws-cdk-lib/aws-opensearchservice';
import { CfnUserPoolDomain } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface OpenSearchDashboardsProxyStackProps {
  appSecurityGroup: ec2.ISecurityGroup;
  // authFn: lambda.IFunction;
  osDomain: aos.IDomain,
  parentStack: Stack;
  userPoolDomainName: string;
  openSearchEndpoint: string;
  vpc: ec2.IVpc;
}

export default class OpenSearchDashboardsProxyStack extends Stack {
  public readonly bastionHost: ec2.BastionHostLinux;
  public readonly eip: ec2.CfnEIP;
  private readonly parentStack: Stack;

  constructor(scope: Construct, id: string, 
    odpProps: OpenSearchDashboardsProxyStackProps, 
    props: StackProps={}
  ) {
    super(scope, id, props);
    this.parentStack = odpProps.parentStack;
    const handle = new ec2.InitServiceRestartHandle();

    this.bastionHost = new ec2.BastionHostLinux(this, 'OpenSearchDashboardsHost', {
        vpc: odpProps.vpc,
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(10, { encrypted: true })
        }],
        instanceName: 'OpenSearchDashboardsProxy',
        securityGroup: odpProps.appSecurityGroup,
        subnetSelection: {subnetType: ec2.SubnetType.PUBLIC},
        init: ec2.CloudFormationInit.fromElements(
        ec2.InitCommand.shellCommand('ifconfig'),
        ec2.InitCommand.shellCommand('dnf install nginx -y'),
        ec2.InitFile.fromString(
            '/etc/nginx/conf.d/default.conf',
            `server {
                listen 443 ssl;
                server_name $host;
                rewrite ^/$ https://$host/_dashboards redirect;
                resolver <SUBNET_RESOLVER_IP> ipv6=off valid=5s;
                set $domain_endpoint ${odpProps.openSearchEndpoint};
                set $cognito_host ${odpProps.userPoolDomainName}.auth.${this.region}.amazoncognito.com;
                
                ssl_certificate           /etc/nginx/cert.crt;
                ssl_certificate_key       /etc/nginx/cert.key;
                
                ssl_session_cache  builtin:1000  shared:SSL:10m;
                ssl_protocols  TLSv1 TLSv1.1 TLSv1.2;
                ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;
                ssl_prefer_server_ciphers on;
                
                location ^~ /_dashboards {
                    proxy_pass https://$domain_endpoint;
                    proxy_redirect https://$cognito_host https://$host;
                    proxy_redirect https://$domain_endpoint https://$host;
                    proxy_cookie_domain $domain_endpoint $host;
                    proxy_cookie_path ~*^/$ /_dashboards/;
                    proxy_buffer_size 128k;
                    proxy_buffers 4 256k;
                    proxy_busy_buffers_size 256k;
                }
                
                location ~ \\/(log|sign|fav|forgot|change|saml|oauth2|confirm) {
                    proxy_pass https://$cognito_host;
                    proxy_redirect https://$domain_endpoint https://$host;
                    proxy_redirect https://$cognito_host https://$host;
                    proxy_cookie_domain $cognito_host $host;
                }

                location ^~ /_aos {
                    proxy_pass https://$domain_endpoint;
                    proxy_redirect https://$domain_endpoint https://$host;
                    proxy_cookie_domain $domain_endpoint $host;
                    proxy_cookie_path ~*^/$ /_aos/;
                    proxy_buffer_size 128k;
                    proxy_buffers 4 256k;
                    proxy_busy_buffers_size 256k;
                }
            }`,
            { serviceRestartHandles: [handle] }
        ),
        ec2.InitFile.fromString(
            '/tmp/ec2_cert_info.cfg',
            `[ req ]
prompt                 = no
default_bits           = 2048
default_keyfile        = privkey.pem
distinguished_name     = req_distinguished_name
x509_extensions        = v3_ca

dirstring_type = nobmp

[ req_distinguished_name ]
countryName                    = ${this.parentStack.node.getContext('os_dashboards_ec2_cert_country')}
stateOrProvinceName            = ${this.parentStack.node.getContext('os_dashboards_ec2_cert_state')}
localityName                   = ${this.parentStack.node.getContext('os_dashboards_ec2_cert_city')}
commonName                     = ${this.parentStack.node.getContext('os_dashboards_ec2_cert_hostname')}
emailAddress                   = ${this.parentStack.node.getContext('os_dashboards_ec2_cert_email_address')}

[ v3_ca ]

subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid:always,issuer:always
basicConstraints = CA:true`,
            { serviceRestartHandles: [handle] }
        ),
        ec2.InitCommand.shellCommand('openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/cert.key -out /etc/nginx/cert.crt -config /tmp/ec2_cert_info.cfg'),
        ec2.InitCommand.shellCommand("cd /tmp && ifconfig ens5 | grep 'inet ' > inet.txt && export IFS=' ' && read -a strarr <<< `cat inet.txt` && export localIp=`echo ${strarr[1]}` && echo Local IP is: $localIp && export IFS=. && read -a iparr <<< $localIp && export IFS=' ' && read -a iparr <<< ${iparr[*]} && export resolverIp=${iparr[0]}.${iparr[1]}.0.2 && echo Resolver IP is $resolverIp && sed -i \"s/<SUBNET_RESOLVER_IP>/${resolverIp}/\" /etc/nginx/conf.d/default.conf"),
        ec2.InitService.enable('nginx', { serviceRestartHandle: handle })
        )
    });

    odpProps.osDomain.grantIndexReadWrite('*', this.bastionHost.grantPrincipal);
    odpProps.osDomain.grantReadWrite(this.bastionHost.grantPrincipal);

    // this.bastionHost.node.addDependency(odpProps.userPoolDomain);

    this.eip = new ec2.CfnEIP(this, 'BastionHostEip', {
        domain: 'vpc',
        instanceId: this.bastionHost.instanceId,
        networkBorderGroup: this.region
    });
    }
}