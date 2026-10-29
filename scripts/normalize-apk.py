"""Keep Android ZIP entry names portable across Windows AAPT versions."""
import pathlib,sys,zipfile
source,target=map(pathlib.Path,sys.argv[1:3]);seen=set()
with zipfile.ZipFile(source) as src,zipfile.ZipFile(target,'w',allowZip64=False) as dst:
 for old in src.infolist():
  name=old.filename.replace('\\','/')
  if name.startswith('/') or '..' in pathlib.PurePosixPath(name).parts or name in seen:raise ValueError('Invalid APK ZIP entry')
  seen.add(name);info=zipfile.ZipInfo(name,old.date_time);info.compress_type=old.compress_type;info.external_attr=old.external_attr;info.create_system=old.create_system
  dst.writestr(info,src.read(old))
if 'assets/game/index.html' not in seen or 'classes.dex' not in seen:raise ValueError('Incomplete APK')
print('Normalized Android asset paths; '+str(len(seen))+' entries')
