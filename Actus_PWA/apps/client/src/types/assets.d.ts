// Assets binários importáveis (o expo/types fazia isso via expo-env.d.ts).
declare module '*.png' {
  const asset: number;
  export default asset;
}
declare module '*.jpg' {
  const asset: number;
  export default asset;
}
declare module '*.ttf' {
  const asset: number;
  export default asset;
}
