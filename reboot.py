import server
from aiohttp import web
import os
import sys
import subprocess


@server.PromptServer.instance.routes.post("/reboot")
async def reboot(request):
    try:
        sys.stdout.close_log()
    except Exception:
        pass

    try:
        sys_argv = sys.argv.copy()
        if '--windows-standalone-build' in sys_argv:
            sys_argv.remove('--windows-standalone-build')

        if sys_argv[0].endswith("__main__.py"):
            module_name = os.path.basename(os.path.dirname(sys_argv[0]))
            cmds = [sys.executable, '-m', module_name] + sys_argv[1:]
        else:
            cmds = [sys.executable] + sys_argv

        print(f"\nRestarting ComfyUI...", flush=True)
        subprocess.Popen(cmds, cwd=os.getcwd())
        os._exit(0)

    except Exception as e:
        print(f"Restart failed: {e}", flush=True)
        return web.Response(status=500, text=str(e))

    return web.Response(status=200)
