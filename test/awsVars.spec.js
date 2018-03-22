import test from 'ava'
import proxyquire from 'proxyquire'

test('Correctly parses vars', async t => {
  var awsVars = proxyquire.noCallThru()('../src/awsVars', {
    'aws-sdk': {
      CloudFormation: () => ({
        describeStacks: () => ({
          promise: () => Promise.resolve({
              Stacks: 
              [
                {
                  "Outputs": [
                      {
                          "OutputKey": "ServiceEndpoint",
                          "OutputValue": "https://abcdef.execute-api.ap-southeast-2.amazonaws.com/dev",
                          "Description": "URL of the service endpoint"
                      }
                  ]
                }
              ]
          })
        })
      })
    }
  })
  var result = await awsVars.getValueFromCF('region', 'servicename', 'ServiceEndpoint')
  t.is(result, 'https://abcdef.execute-api.ap-southeast-2.amazonaws.com/dev')
})

test('Throws an error if var can`t be found', async t => {
  var awsVars = proxyquire.noCallThru()('../src/awsVars', {
    'aws-sdk': {
      CloudFormation: () => ({
        describeStacks: () => ({
          promise: () => Promise.resolve({
              Stacks: 
              [
                {
                  "Outputs": [
                      {
                          "OutputKey": "AnotherEndpoint",
                          "OutputValue": "https://abcdef.execute-api.ap-southeast-2.amazonaws.com/dev",
                          "Description": "URL of the service endpoint"
                      }
                  ]
                }
              ]
          })
        })
      })
    }
  })
  var error = await t.throws(awsVars.getValueFromCF('region', 'servicename', 'ServiceEndpoint'))
  t.is(error.message, `Output ServiceEndpoint could not be found in Stack servicename region region`)
})



test('Correctly parses ssm vars', async t => {
  var awsVars = proxyquire.noCallThru()('../src/awsVars', {
    'aws-sdk': {
      SSM: () => ({
        getParameter: () => ({
          promise: () => Promise.resolve({
              "Parameter":
                  {
                      "Value": "https://abcdef.execute-api.ap-southeast-2.amazonaws.com/dev",
                  }
          })
        })
      })
    }
  })
  
  var test = await awsVars.getValueSSMCR("region", 'name')
  t.is(test, 'https://abcdef.execute-api.ap-southeast-2.amazonaws.com/dev')
})