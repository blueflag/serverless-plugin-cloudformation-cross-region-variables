# serverless-plugin-cloudformation-cross-region-variables 

This plugin supports using [coudformation stack outputs](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html) from stacks in different regions.

Adds new variable syntax to serverless formatted as such `${cfcr:Region:StackName:OutputKey}`

## Usage

```yaml

custom:
  # We have another stack we want to know about in us-east-1
  myServiceEndpoint: ${cfcr:us-east-1:other-stack-name-${opt:stage}:ServiceEndpoint}

plugins:
  - serverless-plugin-cloudformation-cross-region-variables 
```


## Attributions

This plugin used [serverless-plugin-git-variables](https://github.com/jacob-meacham/serverless-plugin-git-variables) as a base.