export type SneakyAny = Parameters<typeof console.log>[number];
const x: SneakyAny = 5;
x.foo();
