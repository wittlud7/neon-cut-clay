package com.neoncut.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/** Offline-only host. No INTERNET, storage, identifier or account permissions. */
public final class MainActivity extends Activity {
  private WebView web;
  private String pendingBackup;
  private static final String ORIGIN = "https://appassets.androidplatform.net/";
  private static final int SAVE = 11, OPEN = 12;
  private static final int MAX_BACKUP = 1048576;

  @Override public void onCreate(Bundle saved) {
    super.onCreate(saved);
    getWindow().setFlags(1024,1024);
    web = new WebView(this);
    web.setBackgroundColor(0xfff6f3eb);
    if((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0)try{android.util.Log.i("NeonCut","Asset roots: "+java.util.Arrays.toString(getAssets().list("")));android.util.Log.i("NeonCut","Game assets: "+java.util.Arrays.toString(getAssets().list("game")));}catch(Exception e){}
    WebSettings settings=web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setAllowFileAccessFromFileURLs(false);
    settings.setAllowUniversalAccessFromFileURLs(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setMediaPlaybackRequiresUserGesture(true);
    WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0);
    web.addJavascriptInterface(new Host(),"NeonHost");
    web.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return !local(request.getUrl());}
      @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
        Uri uri=request.getUrl();
        if(!local(uri))return error(403,"Forbidden");
        String name=uri.getPath();if(name==null||name.equals("/"))name="/index.html";
        if(name.contains("..")||name.contains("\\")||name.indexOf('\0')>=0)return error(403,"Forbidden");
        String mime=name.endsWith(".html")?"text/html":name.endsWith(".js")?"application/javascript":name.endsWith(".json")?"application/json":name.endsWith(".wav")?"audio/wav":name.endsWith(".png")?"image/png":"application/octet-stream";
        try{return new WebResourceResponse(mime,"UTF-8",getAssets().open("game"+name));}catch(Exception e){if((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0)android.util.Log.e("NeonCut","Asset load failed: "+name,e);return error(404,"Not found");}
      }
    });
    web.setOnApplyWindowInsetsListener((v,insets)->{
      if(Build.VERSION.SDK_INT>=28&&insets.getDisplayCutout()!=null){android.view.DisplayCutout d=insets.getDisplayCutout();v.setPadding(d.getSafeInsetLeft(),d.getSafeInsetTop(),d.getSafeInsetRight(),Math.max(d.getSafeInsetBottom(),insets.getSystemWindowInsetBottom()));}
      else v.setPadding(0,0,0,insets.getSystemWindowInsetBottom());
      return insets;
    });
    setContentView(web);
    if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0,()->back());
    web.loadUrl(ORIGIN);
  }
  private boolean local(Uri uri){return "https".equals(uri.getScheme())&&"appassets.androidplatform.net".equals(uri.getHost())&&(uri.getPort()==-1||uri.getPort()==443);}
  private WebResourceResponse error(int code,String message){WebResourceResponse response=new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(message.getBytes(StandardCharsets.UTF_8)));response.setStatusCodeAndReasonPhrase(code,message);return response;}
  private void js(String code){if(web!=null)web.evaluateJavascript(code,null);}
  private void back(){js("if(window.laneGame){if(laneGame.state.screen==='home'&&!laneGame.state.modal){NeonHost.confirmExit()}else{laneGame.back()}}");}
  @Override public void onBackPressed(){back();}
  @Override protected void onPause(){js("if(window.laneGame){laneGame.background()}");if(web!=null)web.onPause();super.onPause();}
  @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
  @Override protected void onDestroy(){if(web!=null){web.removeJavascriptInterface("NeonHost");web.destroy();web=null;}super.onDestroy();}
  public final class Host {
    @JavascriptInterface public void haptic(){runOnUiThread(()->{if(web!=null)web.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY);});}
    @JavascriptInterface public void confirmExit(){runOnUiThread(()->new AlertDialog.Builder(MainActivity.this).setTitle("结束放映？").setMessage("进度已经保存在本机。").setNegativeButton("继续",null).setPositiveButton("退出",(d,w)->finish()).show());}
    @JavascriptInterface public void saveBackup(String data){
      if(data==null||data.length()>MAX_BACKUP)return;
      try{if(!"neon-cut-save".equals(new JSONObject(data).optString("format")))return;}catch(Exception e){return;}
      runOnUiThread(()->{pendingBackup=data;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/json");intent.putExtra(Intent.EXTRA_TITLE,"neon-cut-save.json");try{startActivityForResult(intent,SAVE);}catch(Exception e){message("未找到文件管理器");}});
    }
    @JavascriptInterface public void openBackup(){runOnUiThread(()->{Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");try{startActivityForResult(intent,OPEN);}catch(Exception e){message("未找到文件管理器");}});}
  }
  private void message(String s){Toast.makeText(this,s,Toast.LENGTH_SHORT).show();}
  @Override protected void onActivityResult(int request,int result,Intent data){
    super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null||data.getData()==null){if(request==SAVE)pendingBackup=null;return;}
    try{
      if(request==SAVE&&pendingBackup!=null){try(OutputStream stream=getContentResolver().openOutputStream(data.getData())){if(stream==null)throw new Exception();stream.write(pendingBackup.getBytes(StandardCharsets.UTF_8));}pendingBackup=null;message("存档已导出");}
      if(request==OPEN){
        ByteArrayOutputStream buffer=new ByteArrayOutputStream();try(InputStream stream=getContentResolver().openInputStream(data.getData())){byte[] chunk=new byte[4096];int n;if(stream==null)throw new Exception();while((n=stream.read(chunk))!=-1){if(buffer.size()+n>MAX_BACKUP)throw new Exception();buffer.write(chunk,0,n);}}
        String json=new String(buffer.toByteArray(),StandardCharsets.UTF_8);new JSONObject(json);
        js("try{laneGame.importData("+JSONObject.quote(json)+")}catch(e){alert('存档格式不正确，原进度未改变。')}");
      }
    }catch(Exception e){pendingBackup=null;message("文件读取或保存失败，原进度未改变。");}
  }
}
