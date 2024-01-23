export const nftExt = '.json';
export const nftExtAscii = '0010111001101010011100110110111101101110';
export const nftExtLength = 5;

export const convertStringToAsciiBinary = (str: string): string => {
  const nonZeroPortion =  Array.from(str)
    .map(char => char.charCodeAt(0) // Convert char to ASCII code
      .toString(2)      // Convert ASCII code to binary
      .padStart(8, '0') // Ensure each binary number has 8 bits
    );
  
  const nonZeroPortionString = nonZeroPortion.join('');
  const numWithExt = nonZeroPortionString + nftExtAscii;
  
  // pad with ascii zeros to make 128 bits
  const asciiZero = '00110000';
  return numWithExt.padStart(128, asciiZero)
}

export const asciiBinaryToString = (binaryStr: string): string => {
  let text = '';
  for (let i = 0; i < binaryStr.length; i += 8) {
      const byte = binaryStr.slice(i, i + 8);
      const ascii = parseInt(byte, 2);
      text += String.fromCharCode(ascii);
  }
  return text;
}

export const convertBinaryToU128 = (binaryStr: string): string => {
  const u128 = BigInt('0b' + binaryStr);
  return u128.toString() + 'u128';
}

export const convertU128ToBinary = (u128Str: string): string => {
  const u128 = BigInt(u128Str);
  return u128.toString(2).padStart(128, '0');
}