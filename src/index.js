
var Observable = require('rxjs/Rx').Observable

import {getValueSSMCR, getValueFromCF} from './awsVars';

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
    try{
      var value = await getValueSSMCR(region, variable);
      this.resolvedValues[variableString] = value;
      return value;
    } catch (e){
      console.warn(e.message);
    }
  }

  async _getValueFromCF(region, stack, variable, variableString) {
    try{
      var value = await getValueFromCF(region, stack, variable);
      this.resolvedValues[variableString] = value;
      return value;
    } catch (e){
      console.warn(e.message);
    }
  }
}
