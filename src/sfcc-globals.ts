// Global variables provided by the SFCC Scripting API and the Rhino runtime.
// These are available in all server-side cartridge scripts without requiring an import.
// See https://salesforcecommercecloud.github.io/b2c-dev-doc/docs/current/scriptapi/html/index.html
const sfccGlobals: Record<string, boolean> = {
  dw: true,
  global: true,

  APIException: true,
  ConversionError: true,
  customer: true,
  empty: true,
  Fault: true,
  IOError: true,
  Iterator: true,
  PIPELET_ERROR: true,
  PIPELET_NEXT: true,
  QName: true,
  request: true,
  response: true,
  session: true,
  slotcontent: true,
  StopIteration: true,
  SystemError: true,
  webreferences: true,
  webreferences2: true,
  XML: true,
  XMLList: true,
  XMLStreamError: true,
}

export default sfccGlobals
