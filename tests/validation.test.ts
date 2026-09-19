import { expect } from 'chai';
import { Validation } from '../src/utils/validators';

const CURRENT_YEAR = new Date().getFullYear();

describe('Validation — обов’язкові поля', () => {
  it('порожній рядок і самі пробіли не проходять', () => {
    expect(Validation.isRequired('')).to.equal(false);
    expect(Validation.isRequired('   ')).to.equal(false);
    expect(Validation.isRequired('\t\n')).to.equal(false);
  });

  it('null та undefined не проходять', () => {
    expect(Validation.isRequired(null)).to.equal(false);
    expect(Validation.isRequired(undefined)).to.equal(false);
  });

  it('непорожній рядок проходить', () => {
    expect(Validation.isRequired('Clean Code')).to.equal(true);
    expect(Validation.isRequired(' x ')).to.equal(true);
  });
});

describe('Validation — ID користувача (тільки цифри)', () => {
  it('приймає рядок із самих цифр', () => {
    expect(Validation.isValidUserId('1725533394038')).to.equal(true);
    expect(Validation.isValidUserId('0')).to.equal(true);
  });

  it('відхиляє літери, символи та змішані рядки', () => {
    expect(Validation.isValidUserId('abc')).to.equal(false);
    expect(Validation.isValidUserId('172a533')).to.equal(false);
    expect(Validation.isValidUserId('17-25')).to.equal(false);
    expect(Validation.isValidUserId('12.5')).to.equal(false);
    expect(Validation.isValidUserId('+380671234567')).to.equal(false);
  });

  it('відхиляє порожнє значення', () => {
    expect(Validation.isValidUserId('')).to.equal(false);
    expect(Validation.isValidUserId('   ')).to.equal(false);
  });

  it('validateUserIdInput() повертає конкретне повідомлення про помилку', () => {
    expect(Validation.validateUserIdInput('')).to.equal(Validation.MESSAGES.required);
    expect(Validation.validateUserIdInput('abc')).to.equal(Validation.MESSAGES.digitsOnly);
    expect(Validation.validateUserIdInput('1725533394038')).to.equal(null);
  });
});

describe('Validation — рік видання', () => {
  it('приймає коректний чотиризначний рік', () => {
    expect(Validation.isValidYear('2008')).to.equal(true);
    expect(Validation.isValidYear('1999')).to.equal(true);
    expect(Validation.isValidYear('1450')).to.equal(true);
    expect(Validation.isValidYear(String(CURRENT_YEAR))).to.equal(true);
  });

  it('відхиляє неправильну кількість цифр', () => {
    expect(Validation.isValidYear('20')).to.equal(false);
    expect(Validation.isValidYear('200')).to.equal(false);
    expect(Validation.isValidYear('20088')).to.equal(false);
  });

  it('відхиляє нецифрові значення', () => {
    expect(Validation.isValidYear('двітисячі')).to.equal(false);
    expect(Validation.isValidYear('20o8')).to.equal(false);
    expect(Validation.isValidYear('2008 р.')).to.equal(false);
    expect(Validation.isValidYear('')).to.equal(false);
  });

  it('відхиляє рік із майбутнього', () => {
    expect(Validation.isValidYear(String(CURRENT_YEAR + 1))).to.equal(false);
  });

  it('відхиляє рік до винайдення друку', () => {
    expect(Validation.isValidYear('1000')).to.equal(false);
    expect(Validation.isValidYear('1449')).to.equal(false);
  });

  it('регулярка YEAR_PATTERN перевіряє саме формат, не діапазон', () => {
    expect(Validation.YEAR_PATTERN.test('1000')).to.equal(true);
    expect(Validation.YEAR_PATTERN.test('2199')).to.equal(true);
    expect(Validation.YEAR_PATTERN.test('2200')).to.equal(false);
    expect(Validation.YEAR_PATTERN.test('999')).to.equal(false);
  });
});

describe('Validation — email', () => {
  it('приймає коректні адреси', () => {
    expect(Validation.isValidEmail('artem@gmail.com')).to.equal(true);
    expect(Validation.isValidEmail('a.b-c_d@sub.domain.ua')).to.equal(true);
  });

  it('відхиляє некоректні адреси', () => {
    expect(Validation.isValidEmail('artem')).to.equal(false);
    expect(Validation.isValidEmail('artem@')).to.equal(false);
    expect(Validation.isValidEmail('artem@gmail')).to.equal(false);
    expect(Validation.isValidEmail('artem @gmail.com')).to.equal(false);
    expect(Validation.isValidEmail('@gmail.com')).to.equal(false);
  });
});

describe('Validation.validateBook()', () => {
  it('валідна форма не має помилок', () => {
    const result = Validation.validateBook({
      title: 'Clean Code',
      author: 'Robert Martin',
      year: '2008',
    });

    expect(result.valid).to.equal(true);
    expect(result.errors).to.deep.equal({});
  });

  it('позначає всі три порожні поля як обов’язкові', () => {
    const result = Validation.validateBook({ title: '', author: '', year: '' });

    expect(result.valid).to.equal(false);
    expect(result.errors.title).to.equal(Validation.MESSAGES.required);
    expect(result.errors.author).to.equal(Validation.MESSAGES.required);
    expect(result.errors.year).to.equal(Validation.MESSAGES.required);
  });

  it('для нецифрового року повідомляє саме про цифри', () => {
    const result = Validation.validateBook({
      title: 'Clean Code',
      author: 'Robert Martin',
      year: '20o8',
    });

    expect(result.valid).to.equal(false);
    expect(result.errors.year).to.equal(Validation.MESSAGES.digitsOnly);
  });

  it('для трицифрового року повідомляє про формат', () => {
    const result = Validation.validateBook({
      title: 'Clean Code',
      author: 'Robert Martin',
      year: '208',
    });

    expect(result.errors.year).to.equal(Validation.MESSAGES.yearFormat);
  });

  it('для року з майбутнього повідомляє про діапазон', () => {
    const result = Validation.validateBook({
      title: 'Clean Code',
      author: 'Robert Martin',
      year: String(CURRENT_YEAR + 1),
    });

    expect(result.errors.year).to.equal(Validation.MESSAGES.yearRange);
  });

  it('відхиляє надто коротку назву', () => {
    const result = Validation.validateBook({ title: 'C', author: 'Robert', year: '2008' });

    expect(result.errors.title).to.equal(Validation.MESSAGES.titleLength);
  });
});

describe('Validation.validateUser()', () => {
  it('валідна форма не має помилок', () => {
    const result = Validation.validateUser({ name: 'Артем', email: 'artem@gmail.com' });

    expect(result.valid).to.equal(true);
    expect(result.errors).to.deep.equal({});
  });

  it('позначає порожні поля', () => {
    const result = Validation.validateUser({ name: '', email: '' });

    expect(result.valid).to.equal(false);
    expect(result.errors.name).to.equal(Validation.MESSAGES.required);
    expect(result.errors.email).to.equal(Validation.MESSAGES.required);
  });

  it('окремо повідомляє про некоректний email', () => {
    const result = Validation.validateUser({ name: 'Артем', email: 'artem@gmail' });

    expect(result.valid).to.equal(false);
    expect(result.errors.name).to.equal(undefined);
    expect(result.errors.email).to.equal(Validation.MESSAGES.email);
  });
});
