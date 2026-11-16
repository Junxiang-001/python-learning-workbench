const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const PyExec = require(path.join(__dirname, '..', 'pyexec.js'));

function run(code) {
  return PyExec.run(code);
}

function assertOutput(code, expected) {
  const result = run(code);
  assert.equal(result.error, null, result.error ? JSON.stringify(result.error) : '');
  assert.equal(result.stdout, expected);
}

function assertError(code, type, expectedStdout) {
  const result = run(code);
  assert.equal(result.ok, false);
  assert.equal(result.error && result.error.type, type, JSON.stringify(result));
  if (expectedStdout !== undefined) assert.equal(result.stdout, expectedStdout);
}

test('function assignment is local, while global and nonlocal opt out', () => {
  assertOutput(`x = "global"
def f():
    x = "local"
    return x
print(f())
print(x)`, 'local\nglobal');

  assertOutput(`x = 0
def f():
    global x
    x = 1
f()
print(x)`, '1');

  assertOutput(`def outer():
    x = 0
    def inner():
        x = 1
    inner()
    return x
print(outer())`, '0');

  assertOutput(`def outer():
    x = 0
    def inner():
        nonlocal x
        x = 1
    inner()
    return x
print(outer())`, '1');
});

test('default arguments evaluate once at definition time and share mutable defaults', () => {
  assertOutput(`value = 1
def f(arg=value):
    return arg
value = 2
print(f())`, '1');

  assertOutput(`def f(items=[]):
    items.append(1)
    return items
print(f())
print(f())`, '[1]\n[1, 1]');
});

test('chained comparisons use each middle operand once and short circuit', () => {
  assertOutput(`print(1 < 2 < 3)
print(1 < 2 > 3)
print(3 > 2 > 1)
print(1 == 1 == 1)`, 'True\nFalse\nTrue\nTrue');

  assertOutput(`def middle():
    print("evaluated")
    return 2
print(3 < 2 < middle())`, 'False');
});

test('dictionary keys treat booleans and equal numbers as the same key', () => {
  assertOutput(`d = {True: "bool", 1: "int"}
print(len(d))
print(d[1])
print(1 in d)
print(d)
d[False] = "zero"
print(d[0])
print(len(d))`, "1\nint\nTrue\n{True: 'int'}\nzero\n2");
});

test('for else runs only without break', () => {
  assertOutput(`for i in range(3):
    if i == 1:
        break
else:
    print("for else")
print("after break")
for i in range(2):
    pass
else:
    print("for completed")`, 'after break\nfor completed');
});

test('while else runs only without break', () => {
  assertOutput(`n = 0
while n < 3:
    n += 1
    if n == 2:
        break
else:
    print("while else")
print("after break")
while n < 3:
    n += 1
else:
    print("while completed")`, 'after break\nwhile completed');
});

test('try else errors bypass sibling handlers and finally runs once', () => {
  assertError(`try:
    print("body")
except Exception:
    print("caught")
else:
    print(1 / 0)
finally:
    print("finally")`, 'ZeroDivisionError', 'body\nfinally');
});

test('finally is not duplicated for an unhandled exception', () => {
  assertError(`try:
    print("body")
    print(1 / 0)
finally:
    print("finally")`, 'ZeroDivisionError', 'body\nfinally');
});

test('range rejects huge lengths before materializing the sequence', () => {
  const script = `const PyExec = require(${JSON.stringify(path.join(__dirname, '..', 'pyexec.js'))});
const result = PyExec.run('range(1000000000)');
process.stdout.write(JSON.stringify(result));`;
  const child = spawnSync(process.execPath, ['-e', script], {
    encoding: 'utf8',
    timeout: 1500,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(child.error, undefined, child.error && child.error.message);
  assert.equal(child.status, 0, child.stderr);
  const result = JSON.parse(child.stdout);
  assert.equal(result.error && result.error.type, 'MemoryError');
});

test('string and list repetition have allocation limits', () => {
  assertError('"a" * 1000000', 'MemoryError');
  assertError('[1] * 1000000', 'MemoryError');
  assertOutput('print("ab" * 3)\nprint([1] * 2)', 'ababab\n[1, 1]');
});
