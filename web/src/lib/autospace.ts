const CJK_THEN_LATIN = /([㐀-鿿])([A-Za-z0-9])/g
const LATIN_THEN_CJK = /([A-Za-z0-9])([㐀-鿿])/g

/**
 * 中文和英文字母、数字挨着时补一个空格：「你和1号房主」→「你和 1 号房主」。
 *
 * 拼句子时插进来的称呼可能是「你」也可能是「1 号房主」，模板里没法写死空格，统一在显示前补。
 */
export function autospace(text: string): string {
  return text.replace(CJK_THEN_LATIN, '$1 $2').replace(LATIN_THEN_CJK, '$1 $2')
}
