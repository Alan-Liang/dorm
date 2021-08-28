export const checkAmount = amount => {
  if (!amount || isNaN(amount) || !/[0-9]*\.?[0-9]{0,2}/.test(amount)) return '请正确填写金额'
  if (Number(amount) < 0) return '???'
  if (Number(amount) === 0) return '没有发生支付，不用记账'
}
