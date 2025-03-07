import { Lobby } from './lobby.schema';

describe('LobbySchema', () => {
  it('should be defined', () => {
    expect(new Lobby()).toBeDefined();
  });
});
