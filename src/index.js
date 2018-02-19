var AWS = require('aws-sdk')
var Observable = require('rxjs/Rx').Observable

const CF_PREFIX = 'cfcr'
const CF_SPLIT = /(cfcr):(.*?):(.*?):([0-9a-zA-Z]*)/
const CF_SPLIT_DOT = /(cfcr):(.*?)\.(.*?):([0-9a-zA-Z]*)/

const SSM_PREFIX = 'ssmcr'
const SSM_SPLIT = /(ssmcr):(.*?):(.*)/

export default class ServerlessCFCrossRegionVariables {
  constructor(serverless, options) {
    this.resolvedValues = {}
    const delegate = serverless.variables.getValueFromSource.bind(serverless.variables)
    serverless.variables.getValueFromSource = (variableString) => {
      if(this.resolvedValues[variableString]){
          return Promise.resolve(this.resolvedValues[variableString])
      }
      if (variableString.startsWith(`${CF_PREFIX}:`)) {
        var split = CF_SPLIT.exec(variableString) || CF_SPLIT_DOT.exec(variableString);
        if(split === null){
          throw new Error(`Invalid syntax, must be cfcr:region:service:output got "${variableString}"`)
        }
        var [string, cfcr, region, stack, variable] = split
        return this._getValueFromCF(region, stack, variable, variableString)
      } 
      else if (variableString.startsWith(`${SSM_PREFIX}:`)) {
        var split = SSM_SPLIT.exec(variableString)
        if(split === null){
          throw new Error(`Invalid syntax, must be  ssmcr:region:varlocation got "${variableString}"`)
        }
        var [string, ssmcr, region, variable] = split
        return this._getValueSSMCR(region, variable, variableString)
      }
      
      return delegate(variableString)
    }
  }

  async _getValueSSMCR(region, variable, variableString) {
    var value
    var ssm = new AWS.SSM({
      region
    })
     value = await ssm
      .getParameter({Name: variable})
      .promise()
      .then(ii => ii.Value)
      .catch(ee => {
        return;
      });
    this.resolvedValues[variableString] = value
    if (!value) {
      console.warn(`Output ${variable} could not be found in region ${region}`)
    }
    return value;  
  }

  async _getValueFromCF(region, stack, variable, variableString) {
    var value
    var cloudformation = new AWS.CloudFormation({
      region
    })
    var params = {
      StackName: stack
    }
    let cf = await cloudformation.describeStacks(params).promise()
    if (cf.Stacks.length > 0) {
      if (cf.Stacks[0].Outputs) {
        value = await Observable
          .from(cf.Stacks[0].Outputs)
          .filter(ii => ii.OutputKey === variable)
          .map(ii => ii.OutputValue)
          .take(1)
          .toPromise()
        if (!value) {
          console.warn(`Output ${variable} could not be found in Stack ${stack} region ${region}`)
        }
      }
    } else {
      console.warn(`Stack ${stack} could not be found in region ${region}`)
    }
    // Cache before returning
    this.resolvedValues[variableString] = value
    return value;
  }
}
