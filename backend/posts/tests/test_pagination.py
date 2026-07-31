from urllib.parse import urlparse

from django.urls import reverse

from posts.models import Post
from posts.tests.base import PostsBaseTestCase


class FeedCursorPaginationTests(PostsBaseTestCase):
    def setUp(self):
        # feed_global inclui os posts globais do próprio user; 25 > page_size 20
        # garante segunda página. Semeados aqui (não no setUpTestData) pra não
        # poluir os outros testes que contam posts.
        self.client.force_authenticate(user=self.membro_c1a)
        Post.objects.bulk_create(
            [
                Post(author=self.membro_c1a, escopo="global", conteudo=f"g{i}")
                for i in range(25)
            ]
        )
        self.url = reverse("post-feed-global")

    def test_envelope_de_cursor(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        # assinatura do cursor: next/previous/results, SEM count
        self.assertIn("next", resp.data)
        self.assertIn("previous", resp.data)
        self.assertIn("results", resp.data)
        self.assertNotIn("count", resp.data)
        # corta em page_size 20
        self.assertEqual(len(resp.data["results"]), 20)
        self.assertIsNotNone(resp.data["next"])  # há próxima página

    def test_segunda_pagina_anda_sem_repetir(self):
        r1 = self.client.get(self.url)
        ids_p1 = {p["id"] for p in r1.data["results"]}

        # segue o cursor de next (só o querystring, o client já tem o host)
        next_url = r1.data["next"]
        query = urlparse(next_url).query
        r2 = self.client.get(f"{self.url}?{query}")

        self.assertEqual(r2.status_code, 200)
        ids_p2 = {p["id"] for p in r2.data["results"]}
        # as 25 globais semeadas + a post_global do base = 26; 20 + 6 restantes
        self.assertEqual(len(ids_p2), 5)
        self.assertTrue(ids_p1.isdisjoint(ids_p2))  # nenhuma repetição entre páginas


class ListPageNumberPaginationTests(PostsBaseTestCase):
    def test_list_usa_page_number(self):
        # o list normal (não-feed) usa a paginação global: envelope COM count
        self.client.force_authenticate(user=self.pastor)
        resp = self.client.get(reverse("post-list"))
        self.assertEqual(resp.status_code, 200)
        self.assertIn("count", resp.data)
        self.assertIn("results", resp.data)