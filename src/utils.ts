export const addToString = <
  Type extends string,
  Creator extends (...args: any[]) => any,
>(
  type: Type,
  creator: Creator,
) => {
  Object.defineProperty(creator, 'type', {
    configurable: true,
    enumerable: false,
    value: type,
    writable: true,
  });

  return creator as Creator & { type: Type };
};

export const isStrictlyEqual = (a: any, b: any) => a === b;

export const some = (array: any[], fn: (value: any, index: number) => any) => {
  for (let index = 0, length = array.length; index < length; ++index) {
    if (fn(array[index], index)) {
      return true;
    }
  }

  return false;
};
