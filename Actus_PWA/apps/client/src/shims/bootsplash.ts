// Shim web do react-native-bootsplash: sem splash nativo na web, tudo no-op.
const BootSplash = {
  hide: async (_opts?: { fade?: boolean }): Promise<void> => {},
  show: async (_opts?: { fade?: boolean }): Promise<void> => {},
  getVisibilityStatus: async (): Promise<'visible' | 'hidden' | 'transitioning'> => 'hidden',
};

export default BootSplash;
