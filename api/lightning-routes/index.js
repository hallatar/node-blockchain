router.post('/openchannel', async (req, res) => {
  const { peerPubkey, capacity } = req.body;
  const channel = await lightning.openChannel(peerPubkey, capacity);
  res.json({ channelId: channel.channelId });
});

router.post('/pay', async (req, res) => {
  const { invoice } = req.body; // invoice contains amount, paymentHash, destination
  // Find route using simple Dijkstra
  const route = lightning.findRoute(destination, amount);
  await lightning.sendPayment(destination, amount, invoice.paymentHash, route);
  res.json({ status: 'payment_initiated' });
});

router.get('/channels', (req, res) => {
  res.json(Array.from(lightning.channels.values()));
});