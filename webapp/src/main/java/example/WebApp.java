package example;

import static java.util.concurrent.TimeUnit.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.LongAdder;

import io.vertx.core.Vertx;
import io.vertx.core.VertxOptions;
import io.vertx.core.http.HttpServerResponse;
import io.vertx.core.json.Json;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.hawkular.HawkularServerOptions;
import io.vertx.ext.hawkular.ServerType;
import io.vertx.ext.hawkular.VertxHawkularOptions;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;

/**
 * @author Thomas Segismont
 */
public class WebApp {

  public static void main(String[] args) {
    HawkularServerOptions admin = new HawkularServerOptions()
      .setId("admin")
      .setSecret("pa55,Word")
      .setPersona("32843b67-527e-4f03-a4f5-ea328194c61f");
    VertxHawkularOptions metricsOptions = new VertxHawkularOptions()
      .setEnabled(true)
      .setServerType(ServerType.HAWKULAR)
      .setMetricsBridgeAddress("metrics")
      .setMetricsBridgeEnabled(true)
      .setHawkularServerOptions(admin);

    Vertx vertx = Vertx.vertx(new VertxOptions().setMetricsOptions(metricsOptions));

    final LongAdder likes = new LongAdder();
    vertx.setPeriodic(MILLISECONDS.convert(1, SECONDS), timerId -> {
      Map<String, Object> props = new HashMap<>();
      props.put("id", "app.souvenirs.likes");
      props.put("value", likes.sum());
      props.put("type", "counter");
      vertx.eventBus().publish("metrics", new JsonObject(props));
    });

    Router router = Router.router(vertx);

    router.get("/rest/likes").produces("application/json").handler(routingContext -> {
      HttpServerResponse response = routingContext.response();
      response.putHeader("Content-Type", "application/json");
      String json = Json.encode(Collections.singletonMap("value", likes.sum()));
      response.end(json);
    });

    router.post("/rest/likes/increment").produces("application/json").handler(routingContext -> {
      HttpServerResponse response = routingContext.response();
      response.putHeader("Content-Type", "application/json");
      likes.increment();
      String json = Json.encode(Collections.singletonMap("value", likes.sum()));
      response.end(json);
    });


    // By default, use the static file handler
    router.route().handler(StaticHandler.create().setFilesReadOnly(false));

    vertx.createHttpServer().requestHandler(router::accept).listen(8181);
  }

}
