# serverless-cloudformations-crossregion-vars

This plugin supports taking [outputs](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html) from serverless cloudformation stacks in different regions.

## Usage

```yaml

custom:
  # We have another stack we want to know about in us-east-1
  myServiceEndpoint: ${cfcr:us-east-1:other-stack-name-${opt:stage}:ServiceEndpoint}

plugins:
  - serverless-cloudformations-crossregion-vars
```


## Attributions

This plugin used [serverless-plugin-git-variables](https://github.com/jacob-meacham/serverless-plugin-git-variables) as a base.