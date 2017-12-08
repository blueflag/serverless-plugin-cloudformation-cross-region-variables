var AWS = require('aws-sdk')
var Observable = require('rxjs/Rx').Observable
const CF_PREFIX = 'cfcr'
const CF_SPLIT = /(cfcr):(.*?):(.*?):([0-9a-zA-Z]*)/
const CF_SPLIT_DOT = /(cfcr):(.*?)\.(.*?):([0-9a-zA-Z]*)/

export default class ServerlessCFCrossRegionVariables {
  constructor(serverless, options) {
    this.resolvedValues = {}
    const delegate = serverless.variables.getValueFromSource.bind(serverless.variables)
    serverless.variables.getValueFromSource = (variableString) => {
      if (variableString.startsWith(`${CF_PREFIX}:`)) {
        var split = CF_SPLIT.exec(variableString) || CF_SPLIT_DOT.exec(variableString);
        if(split === null){
          throw new Error(`Invalid syntax, must be cfcr:region:service:output got "${variableString}"`)
        }
        return this._getValue(split)
      }

      return delegate(variableString)
    }
  }

  async _getValue([string, cfcr, region, stack, variable]) {
    if (this.resolvedValues[`${region}-${stack}-${variable}`]) {
      return Promise.resolve(this.resolvedValues[`${region}-${stack}-${variable}`])
    }

    return this._getValueFromCF(region, stack, variable)
  }

  async _getValueFromCF(region, stack, variable) {
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
          throw new Error(`Output ${variable} could not be found in Stack ${stack} region ${region}`)
        }
      }
    } else {
      throw new Error(`Stack ${stack} could not be found in region ${region}`)
    }
    // Cache before returning
    this.resolvedValues[`${region}-${stack}-${variable}`] = value
    return value
  }
}
