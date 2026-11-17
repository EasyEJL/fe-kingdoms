"""Reject an incompatible local verification image before building."""
import hashlib, pathlib, platform, shutil, subprocess, sys

expected = '3732fbe8a6e9d2ea3925d02d0e3a1478bc1e01d742c2be75d3ea7300c46c45f0'
compiler = pathlib.Path('/usr/local/bin/fe')
if platform.system() != 'Linux' or platform.machine() != 'x86_64':
    sys.exit('Toolchain requires Linux x86-64.')
if not compiler.is_file() or hashlib.sha256(compiler.read_bytes()).hexdigest() != expected:
    sys.exit('Fe compiler hash does not match the pinned toolchain.')
fe = subprocess.check_output([str(compiler), '--version'], text=True).strip()
rust = subprocess.check_output(['rustc', '--version'], text=True).strip()
if fe != 'fe 26.5.0 (3dab95f)' or not rust.startswith('rustc 1.94.0 '):
    sys.exit(f'Unexpected toolchain: {fe}; {rust}')
if sys.version_info < (3, 10):
    sys.exit('Python 3.10 or newer is required.')
if not shutil.which('gcc'):
    sys.exit('GCC is required for native compilation.')
print(f'Toolchain verified: {fe}; {rust}; Python {platform.python_version()}')
