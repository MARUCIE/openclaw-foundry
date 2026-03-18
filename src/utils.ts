import chalk from 'chalk';
import ora from 'ora';

export const log = {
  ok:    (msg: string) => console.log(chalk.green('OK')    + ' ' + msg),
  warn:  (msg: string) => console.log(chalk.yellow('WARN')  + ' ' + msg),
  error: (msg: string) => console.log(chalk.red('ERROR')   + ' ' + msg),
  note:  (msg: string) => console.log(chalk.blue('NOTE')   + ' ' + msg),
  step:  (n: number, total: number, msg: string) =>
    console.log(chalk.cyan(`[${n}/${total}]`) + ' ' + msg),
};

export function spinner(text: string) {
  return ora({ text, spinner: 'dots' });
}

export function detectOS(): 'darwin' | 'win32' | 'linux' {
  return process.platform as 'darwin' | 'win32' | 'linux';
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}
