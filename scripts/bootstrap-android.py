import json,subprocess,hashlib,zipfile,pathlib,concurrent.futures
root=pathlib.Path(__file__).resolve().parents[2]/'.build-tools';root.mkdir(exist_ok=True)
jdk={'link': 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jdk_x64_windows_hotspot_21.0.12.1_1.zip', 'checksum': 'f9d6e191ab098c0d416e7d588a24420a8621cd2f4720dab2459b8b7b2d2d8b4e', 'size': 205073461}
a=[{'path': 'platforms;android-35', 'url': 'https://dl.google.com/android/repository/platform-35-ext15_r01.zip', 'checksum': 'ce757091f933b7ac646bf197ce8957cc73b95614', 'size': '64492044'}, {'path': 'platforms;android-35', 'url': 'https://dl.google.com/android/repository/platform-35-ext14_r01.zip', 'checksum': 'c0e5b5511562fc8b8a61b3b3f17f6ffa811e4971', 'size': '64330898'}, {'path': 'platforms;android-35', 'url': 'https://dl.google.com/android/repository/platform-35_r02.zip', 'checksum': '0bb560a90a7a2cbd0dd8348224d518b638fe7949', 'size': '64273788'}, {'path': 'build-tools;35.0.0', 'url': 'https://dl.google.com/android/repository/build-tools_r35_windows.zip', 'checksum': 'af059bb67cf7786f45ee0db85e2d24985df1b4b6', 'size': '59878107'}]
items=[('jdk',jdk['link'],jdk['checksum'],'sha256')]+[(('platform' if v['path'].startswith('platforms') else 'build-tools'),v['url'],v['checksum'],'sha1') for v in a if 'platform-35_r02' in v['url'] or v['path'].startswith('build-tools')]
def work(item):
 name,url,checksum,algo=item;archive=root/(name+'.zip')
 if not archive.exists() or hashlib.new(algo,archive.read_bytes()).hexdigest()!=checksum:
  print('Downloading '+name,flush=True)
  subprocess.run(['curl.exe','-L','--fail','--retry','3','--connect-timeout','25','-sS',url,'-o',str(archive)],check=True)
 if hashlib.new(algo,archive.read_bytes()).hexdigest()!=checksum:raise Exception('Checksum mismatch: '+name)
 target=root/name
 if not target.exists():
  with zipfile.ZipFile(archive) as z:z.extractall(target)
 print('Verified and extracted '+name,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as e:list(e.map(work,items))
