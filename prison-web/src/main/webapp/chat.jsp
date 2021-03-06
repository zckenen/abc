<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
   String path = request.getContextPath();
   String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
   String nickName=request.getParameter("nickName");
   System.out.print(nickName); 
%>
<!DOCTYPE HTML>
<html>
<head>
   <base href="<%=basePath%>">
   <title>My WebSocket</title>
</head>
<body>
   Welcome   <br />
   <div id="message"></div> 
   <input id="text" type="text" />
   <button onclick="send()">Send</button>
   <button onclick="closeWebSocket()">Close</button>
</body> 
<script type="text/javascript">
   var websocket = null;
   //判断当前浏览器是否支持WebSocket
   if ('WebSocket'in window) {
      //websocket = new WebSocket('ws://localhost:8080/prison-web/oneLocareaCount.do <%-- /<%=nickName%> --%>');
      //websocket = new WebSocket('ws://localhost:8080/prison-web/allLoccoorCount.do <%-- /<%=nickName%> --%>');
      //websocket = new WebSocket('ws://localhost:8080/prison-web/cameraServer.do <%-- /<%=nickName%> --%>');
      websocket = new WebSocket('ws://localhost:8080/prison-web/CriChangeServer.do <%-- /<%=nickName%> --%>');
      
   } else {
      alert('Not support websocket');
   }
   //连接发生错误的回调方法
   websocket.onerror = function() {
      setMessageInnerHTML("error");
   };
   //连接成功建立的回调方法
   websocket.onopen = function(event) {
      setMessageInnerHTML("open");
   }
   //接收到消息的回调方法
   websocket.onmessage = function(event) {
      setMessageInnerHTML(event.data); 
      console.log( event.data.split(/\n/) );
   }
   
   
   
   //连接关闭的回调方法
   websocket.onclose = function() {
      setMessageInnerHTML("close");
   }
   //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
   window.onbeforeunload = function() {
      websocket.close();
   }
   //将消息显示在网页上
   function setMessageInnerHTML(innerHTML) {
      document.getElementById('message').innerHTML += innerHTML + '<br/>';
   } 
   //关闭连接
   function closeWebSocket() {
      websocket.close();
   } 
   //发送消息
   function send() {
      var message = document.getElementById('text').value;
     // var message="peo_coo:第一监区|peo_loc:一分监区|peo_groupid:1";
      websocket.send(message);
   }
</script> 
</html>