/**
 * Add the `type` as a static property onto the `actionCreator`.
 *
 * @param type - action type returned by the `actionCreator`
 * @param actionCreator - method to generate the action for dispatch
 * @returns - `actionCreator` augmented with the `type` property
 */
export const addToString = <
  Type extends string,
  ActionCreator extends (...args: any[]) => any,
>(
  type: Type,
  actionCreator: ActionCreator,
) => {
  Object.defineProperty(actionCreator, 'type', {
    configurable: true,
    enumerable: false,
    value: type,
    writable: true,
  });

  return actionCreator as ActionCreator & { type: Type };
};

export const applyErrorToAction = (action: GeneralAction) => {
  if (action.payload instanceof Error) {
    action.error = true;
  }

  return action;
};

/**
 * Are the two values passed strictly equal to one another.
 *
 * @param a - the first value to compare
 * @param b - the second value to compare
 * @returns - are the values passed strictly equal
 */
export const isStrictlyEqual = (a: any, b: any) => a === b;

type GeneralAction = Partial<{
  error: true;
  meta: any;
  payload: any;
  type: string;
}>;

/**
 * Does a value in the array match the given predicate.
 *
 * @param array - array of values to test
 * @param predicate - method to test, where a truthy value returned denotes a match
 * @returns - whether a value in the array matches the predicate
 */
export const some = (
  array: any[],
  predicate: (value: any, index: number) => any,
) => {
  for (let index = 0, length = array.length; index < length; ++index) {
    if (predicate(array[index], index)) {
      return true;
    }
  }

  return false;
};
