/*
   express框架的简单实现
   实现了 1、listen函数
         2、各种方法函数 如get post 
         3、实现了中间件以及错误中间件

*/
 

const http = require('http')
const url = require('url')
/**
 *
 *
 * @returns
 */
function application() {
    let app = function (req, res) {
       //获取请求的方法
        let m = req.method.toLowerCase();
        //获取到路径
        let {
            pathname
        } = url.parse(req.url, true);

        let index = 0;
        //next（）函数
        function next(err) {
            if (index == app.routes.length) {
                return res.end(`cannot find${m}${pathname}`)
            }
            let layer /*{method,path,handler}*/ = app.routes[index++];
            if (err) {  //当 next函数中有错误参数时 寻找有4个参数的handler否则继续向下寻找知道找到并执行
                if (layer.handler.length === 4) {
                    layer.handler(err, req, res, next)
                } else {
                    next(err)
                }
            } else {//当next函数中没有错误参数时
                if (layer.method === 'middle') {//如果layer中的method属性为middle 即为中间件 则执行use中的handler 在app.use的handler中时 必须调用next（）才能继续进行下去
                    if (layer.path === '/' || layer.path === pathname || pathname.startsWith(layer.path + '/')) {//中间件匹配url
                        layer.handler(req, res, next);
                    } else {
                        next();
                    }
                } else {//判断是app.get 还是app.post并且有相对应的方法
                    if ((layer.method === m || layer.method === `all`) && (layer.path === pathname || layer.path === `*`)) {
                        layer.handler(req, res);
                    } else {
                        next();
                    }
                }
            } 
        }
          next(); 



    }
    app.routes = [];//routes存放路由信息的数组
    /**
     * app.use()实现中间件 通过next（）函数来进行layer层的传递
     * 当app.use（）时 产生一个包含middle方法的layer  其他情况如app.get()则会产生一个get方法的layer
     */
    app.use = function (path, handler) {
        if (typeof handler !== 'function') {
            handler = path;
            path = '/';
        }
        let layer = {
            method: 'middle',
            path,
            handler
        }
        app.routes.push(layer); //将中间件放到容器
    }
    app.use((req,res,next)=>{
              let {pathname,query} = url .parse(req.url,true);
              req.path = pathname;
              req.query = query;
              next()
    })
   /**
    * app.all 用途是 当路径与路由中的不匹配时统一执行的handler
    */
    app.all = function (path, handler) {
        let layer = {
            method: `all`,
            path: `*`,
            handler
        }
        app.routes.push(layer);
    }
    /***
     * http.METHODS 是一个包含所有请求方法的数组
     * app[method] 方法 创建一个layer层 其中包括了 method 和 path 以及响应函数handler
     * 并将这个layer层保存到routes路由数组中 如果url或者http模块获取到的请求方法以及路径与保存在route路由数组
     *     的值相等的时候 执行handler
     */
    http.METHODS.forEach(method => {
        method = method.toLocaleLowerCase();
        
        app[method] = function (path, handler) {
            let layer = {
                method,
                path,
                handler
            }
            app.routes.push(layer);
        }
    })
/**
 * http的创建服务器为 http.creatServer(function(req,res){}).listen(port,callback?)
 * 
 */
    app.listen = function () {
        let server = http.createServer(app);
        server.listen(...arguments);
    }
    //   console.log(app.routes);

    return app;
}
module.exports = application;