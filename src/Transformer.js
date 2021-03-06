const {
  isObject,
  getBlockType,
} = require('./utils/checks');

class Transformer {
  constructor() {
    this.mixed = new Set();
    this.hooks = new Map();
  }

  getHooks(type) {
    return this.hooks.get(type) || [];
  }

  mixin(...mixins) {
    mixins.forEach(mixin => {
      const id = mixin.name;
      if (this.mixed.has(mixin)) {
        return;
      }
      this.mixed.add(mixin);
      if (!mixin.setup) {
        throw new Error('Transformer::mixin: mixin ' + id + '  does not contain `setup` method.');
      }
      mixin.setup(this);
    });
  }

  hook(type, fn) {
    if (isObject(type)) {
      for (const key in type) {
        if (type.hasOwnProperty(key)) {
          this.hook(key, fn);
        }
      }
      return;
    }

    if (typeof fn !== 'function') {
      throw new Error('expecting `Transformer::hook(type, *fn*)` to be a function');
    }

    let fns = this.hooks.get(type);
    if (!fns) {
      fns = [];
      this.hooks.set(type, fns);
    }
    fns.push(fn);
  }

  static noopHook (ctx, value) {
    return [false, value];
  }

  transformBlock(ctx, block) {
    while (block && block.type) {
      // while true;
      let typeChanged = false;
      const type = getBlockType(block);
      const hooks = ctx.getHooks(type);

      for (const hook of hooks) {
        block = hook(ctx, block);

        // Block removed.
        if (!block) return block;

        if (getBlockType(block) !== type) {
          // goto while true;
          // abort transform and restart the transform with the new block.
          typeChanged = true;
          break;
        }
      }

      if (!typeChanged) {
        break;
      }
    }

    return block;
  };
}

module.exports = Transformer;
