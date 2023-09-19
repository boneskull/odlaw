import unexpected from 'unexpected';
import {monkeypatch, unmonkeypatch} from '../../src/monkey';

const expect = unexpected.clone();

describe('monkey', function () {
  const k = Symbol('foo');
  describe('monkeypatch()', function () {
    describe('when an object has not been flagged as monkeypatched', function () {
      it('should monkeypatch the object', function () {
        const obj = {};
        const patch = {
          foo() {
            return 'bar';
          },
        };
        expect(
          monkeypatch(k, obj, patch),
          'to have property',
          'foo',
          patch.foo,
        );
      });
    });

    describe('when an object is flagged as having been monkeypatched', function () {
      it('should not monkeypatch the object again', function () {
        const obj = {[k]: true};
        const patch = {
          foo() {
            return 'bar';
          },
        };
        expect(monkeypatch(k, obj, patch), 'not to have property', 'foo');
      });
    });
  });

  describe('unmonkeypatch()', function () {
    describe('when an object has been monkeypatched', function () {
      it('should unmonkeypatch the object', function () {
        const obj = {baz() {}};
        const patch = {
          foo() {
            return 'bar';
          },
        };
        monkeypatch(k, obj, patch);
        expect(unmonkeypatch(k, obj), 'not to have property', 'foo');
      });
    });

    describe('when an object has not been monkeypatched', function () {
      it('should not unmonkeypatch the object', function () {
        const obj = {bar() {}};
        expect(unmonkeypatch(k, obj), 'to be', obj);
      });
    });
  });
});
