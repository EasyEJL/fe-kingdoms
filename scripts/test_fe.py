import pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
source='\n'.join((root/'src'/x).read_text(encoding='utf-8-sig') for x in ('engine.fe','tests.fe'))
(root/'generated/tests.fe').write_text(source)
subprocess.run(['fe','test','--backend','native','-O','1','--jobs','1','--color','never','generated/tests.fe'],cwd=root,check=True)
