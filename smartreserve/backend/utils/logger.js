function now() {
  return new Date().toISOString();
}

function info(message, meta) {
  if (meta !== undefined) {
    console.log(`[${now()}] INFO: ${message}`, meta);
    return;
  }
  console.log(`[${now()}] INFO: ${message}`);
}

function error(message, meta) {
  if (meta !== undefined) {
    console.error(`[${now()}] ERROR: ${message}`, meta);
    return;
  }
  console.error(`[${now()}] ERROR: ${message}`);
}

module.exports = {
  info,
  error,
  logger: { info, error },
};
