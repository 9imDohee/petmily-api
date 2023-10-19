module.exports = (plugin) => {
  plugin.controllers.user.find = (ctx) => {
    console.log(ctx);
    ctx.body = "hi";
  };
  return plugin;
};
