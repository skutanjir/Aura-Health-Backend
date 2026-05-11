with open('src/controllers/post.controller.js', 'r') as f:
    content = f.read()

old_comment = """  async addComment(req, res, next) {
    try {
      const comment = await postService.addComment(req.params.id, req.user.id, req.body);
      return successResponse(res, 'Komentar berhasil ditambahkan', comment, 201);
    } catch (err) {
      next(err);
    }
  },"""

new_comment = """  async addComment(req, res, next) {
    try {
      const comment = await postService.addComment(req.params.id, req.user.id, req.body);
      
      // Emit Realtime event
      const io = req.app.get('io');
      if (io) {
        io.emit('new_comment', {
          postId: req.params.id,
          comment: comment
        });
      }

      return successResponse(res, 'Komentar berhasil ditambahkan', comment, 201);
    } catch (err) {
      next(err);
    }
  },"""

content = content.replace(old_comment, new_comment)
with open('src/controllers/post.controller.js', 'w') as f:
    f.write(content)
