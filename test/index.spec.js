import test from 'ava'
import Serverless from 'serverless'
import proxyquire from 'proxyquire'
import ServerlessCFVariables from '../src'

function buildSls(serverlessCFVariables) {
  const sls = new Serverless()
  sls.pluginManager.addPlugin(serverlessCFVariables)
  sls.init()
  return sls
}

test('Variables are passed through', async t => {
  const sls = buildSls(ServerlessCFVariables)
  sls.service.custom.myVar = 'myVar'
  sls.service.custom.myResoledVar = '${self:custom.myVar}' // eslint-disable-line

  await sls.variables.populateService()
  t.is(sls.service.custom.myResoledVar, 'myVar')
})

test('Correctly parses vars', async t => {
  var serverlessCFVariables = proxyquire.noCallThru()('../src', {
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
  const sls = buildSls(serverlessCFVariables)
  sls.service.custom.myResoledVar = '${cfcr:region:servicename:ServiceEndpoint}' // eslint-disable-lin
  await sls.variables.populateService()
  t.is(sls.service.custom.myResoledVar, 'https://abcdef.execute-api.ap-southeast-2.amazonaws.com/dev')
})

test('Correctly throws an error on incorrect syntax', async t => {
  const sls = buildSls(ServerlessCFVariables)
  sls.service.custom.myResoledVar = '${cfcr:region:servicename}' // eslint-disable-lin
  // await sls.variables.populateService()
  await t.throws(() => sls.variables.populateService(), /Invalid syntax, must be cfcr:region:service:output got/)
})

test('Correctly throws an error if var cant be found', async t => {
  var serverlessCFVariables = proxyquire.noCallThru()('../src', {
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
  const sls = buildSls(serverlessCFVariables)
  sls.service.custom.myResoledVar = '${cfcr:region:servicename:ServiceEndpoint}' // eslint-disable-lin
  let ee = await sls.variables.populateService().catch(ee => ee)
  t.is(ee.message, "Output ServiceEndpoint could not be found in Stack servicename region region");
})