import AWS from 'aws-sdk'
import {Observable} from 'rxjs/Rx'

export function getValueSSMCR(region, variable){
  var value
  var ssm = new AWS.SSM({
    region
  })
  return ssm
    .getParameter({Name: variable})
    .promise()
    .then(({Parameter}) => {
      return Parameter.Value
    })
    .catch(ee => {
      return;
    });  
}

/**
 * Get a value from a cloudformations output.
 */
export async function getValueFromCF(region, stack, variable){
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
  return value;
}