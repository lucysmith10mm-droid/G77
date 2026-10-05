/**
 * 4-Character Captcha Code Generator
 * Uses unambiguous alphanumeric characters (excludes 0, O, 1, I, L)
 * for maximum clarity and effortless user experience.
 */
export function generate4CharCaptcha(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars.charAt(randomIndex);
  }
  return code;
}

export function validateCaptcha(userInput: string, expectedCode: string): boolean {
  if (!userInput || !expectedCode) return false;
  return userInput.trim().toUpperCase() === expectedCode.trim().toUpperCase();
}
