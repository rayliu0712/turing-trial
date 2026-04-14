class Completer {
  private resolvers = Promise.withResolvers<void>();

  get promise() {
    return this.resolvers.promise;
  }

  resolve() {
    this.resolvers.resolve();
  }

  reset() {
    this.resolvers = Promise.withResolvers();
  }
}

export const completer = new Completer();
