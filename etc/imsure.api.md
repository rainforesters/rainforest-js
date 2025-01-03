## API Report File for "imsure"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public (undocumented)
export type array<T extends TypeDesc<unknown>> = {
    [__T__]: T;
}[];

// @public (undocumented)
export const array: TypeDesc<array<TypeDesc<unknown>>>;

// @public (undocumented)
export type bool = boolean | never;

// @public (undocumented)
export const bool: TypeDesc<bool>;

// @public
export const CArray: TypeDesc<array<TypeDesc<unknown>>>;

// @public
export function change(obj: object): void;

// @public (undocumented)
export type float64 = number | (1 & never[]);

// @public (undocumented)
export const float64: TypeDesc<float64>;

// @public (undocumented)
export type int32 = number | (0 & never[]);

// @public (undocumented)
export const int32: TypeDesc<int32>;

// @public (undocumented)
export const object: TypeDesc<object>;

// Warning: (ae-forgotten-export) The symbol "StructType" needs to be exported by the entry point index.d.ts
//
// @public
export function outcome(struct: Struct<StructType>, name?: unknown): Promise<unknown>;

// Warning: (ae-forgotten-export) The symbol "StructTypeDesc" needs to be exported by the entry point index.d.ts
// Warning: (ae-forgotten-export) The symbol "observe" needs to be exported by the entry point index.d.ts
//
// @public
export function ruledef<T extends TypeDesc<Struct<StructTypeDesc>>>(tdesc: T, name: unknown, observe: observe<T>, executor: (self: typeinit<T>) => unknown): void;

// @public (undocumented)
export const string: TypeDesc<string>;

// Warning: (ae-forgotten-export) The symbol "_Struct_" needs to be exported by the entry point index.d.ts
//
// @public (undocumented)
export type Struct<T extends StructType> = T & _Struct_<T>;

// Warning: (ae-forgotten-export) The symbol "_structbody_" needs to be exported by the entry point index.d.ts
//
// @public
export function structbody<T extends TypeDesc<Struct<StructTypeDesc>>>(tdesc: T): _structbody_<T>;

// @public
export function structof<T extends Struct<StructType>>(struct: T): structof<T>;

// @public (undocumented)
export type structof<T extends Struct<StructType>> = T extends Struct<infer U> ? TypeDesc<Struct<{
    [K in keyof U]: U[K] extends Struct<StructType> ? structof<U[K]> : TypeDesc<U[K]>;
}>> : never;

// Warning: (ae-forgotten-export) The symbol "Desc" needs to be exported by the entry point index.d.ts
// Warning: (ae-forgotten-export) The symbol "_typedef_" needs to be exported by the entry point index.d.ts
//
// @public
export function typedef<T>(desc: Desc<T>, tdesc?: _typedef_<T>): _typedef_<T>;

// Warning: (ae-forgotten-export) The symbol "_TypeDesc_" needs to be exported by the entry point index.d.ts
//
// @public (undocumented)
export type TypeDesc<T> = _TypeDesc_<T>;

// Warning: (ae-forgotten-export) The symbol "literal" needs to be exported by the entry point index.d.ts
//
// @public
export function typeinit<T extends TypeDesc<unknown>>(tdesc: T, literal?: literal<typeinit<T>>): typeinit<T>;

// Warning: (ae-forgotten-export) The symbol "keysof" needs to be exported by the entry point index.d.ts
//
// @public (undocumented)
export type typeinit<T extends TypeDesc<unknown>> = T extends TypeDesc<infer U> ? U extends Struct<infer V> ? V extends StructTypeDesc ? Struct<{
    [K in keysof<U>]: U[K] extends infer O ? O extends TypeDesc<unknown> ? typeinit<O> : never : never;
}> : never : U extends never[] ? U : U extends array<infer V> ? typeinit<V>[] : U : never;

// @public (undocumented)
export const unknown: TypeDesc<unknown>;

// Warning: (ae-forgotten-export) The symbol "WrapValueDesc" needs to be exported by the entry point index.d.ts
//
// @public
export function wrapval<T>(desc: WrapValueDesc, val?: T): T;

// (No @packageDocumentation comment for this package)

```
