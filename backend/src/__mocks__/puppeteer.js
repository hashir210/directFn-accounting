const puppeteerMock = {
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
      close: jest.fn().mockResolvedValue(undefined),
      setViewport: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue(undefined),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
};

module.exports = puppeteerMock;