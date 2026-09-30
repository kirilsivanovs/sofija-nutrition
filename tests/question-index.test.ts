import { activeQuestionId } from '../src/scripts/question-index';

describe('activeQuestionId', () => {
  const line = 400;

  it('returns null when every section starts below the line after a jump back to the top', () => {
    const tops = [{ id: 'f-q1', top: 900 }, { id: 'f-q2', top: 1700 }];
    expect(activeQuestionId(tops, line)).toBeNull();
  });

  it('returns the nearest section above the line when several are above', () => {
    const tops = [{ id: 'f-q1', top: -1800 }, { id: 'f-q2', top: -600 }, { id: 'f-q3', top: 700 }];
    expect(activeQuestionId(tops, line)).toBe('f-q2');
  });

  it('returns the section whose top is exactly on the line', () => {
    const tops = [{ id: 'f-q1', top: -300 }, { id: 'f-q2', top: 400 }];
    expect(activeQuestionId(tops, line)).toBe('f-q2');
  });

  it('switches to the next section once its top passes the line', () => {
    expect(activeQuestionId([{ id: 'f-q1', top: -500 }, { id: 'f-q2', top: 401 }], line)).toBe('f-q1');
    expect(activeQuestionId([{ id: 'f-q1', top: -501 }, { id: 'f-q2', top: 399 }], line)).toBe('f-q2');
  });
});
